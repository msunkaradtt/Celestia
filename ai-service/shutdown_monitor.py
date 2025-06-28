# FILE: ai-service/shutdown_monitor.py
import requests
import time
import os
import subprocess

# This is the URL of the Redis instance, which will be provided as an environment variable
# It will be the private IP of the backend EC2 instance
REDIS_HOST = os.getenv('REDIS_HOST')
REDIS_PORT = os.getenv('REDIS_PORT')
IDLE_TIMEOUT_SECONDS = 300  # 5 minutes

def get_queue_count():
    """ A simple (and naive) way to get queue count from Redis without a full client """
    try:
        # This is a bit of a hack to avoid installing a full Redis client.
        # It sends the raw Redis command to get the length of the 'wait' list.
        command = f"redis-cli -h {REDIS_HOST} -p {REDIS_PORT} LLEN art-generation-queue:wait"
        wait_count = int(subprocess.check_output(command, shell=True).strip())

        command = f"redis-cli -h {REDIS_HOST} -p {REDIS_PORT} LLEN art-generation-queue:active"
        active_count = int(subprocess.check_output(command, shell=True).strip())

        return wait_count + active_count
    except Exception as e:
        print(f"Error checking queue: {e}")
        # If we can't check the queue, assume it's not empty to be safe
        return 1

def shutdown_instance():
    """ Shuts down the EC2 instance this script is running on. """
    print("Instance has been idle. Shutting down now.")
    try:
        # We need to get the instance ID from the instance metadata service
        instance_id = requests.get('http://169.254.169.254/latest/meta-data/instance-id', timeout=1).text
        # Get the region as well
        region = requests.get('http://169.254.169.254/latest/dynamic/instance-identity/document', timeout=1).json()['region']

        # Use the AWS CLI to stop the instance
        subprocess.run(f"aws ec2 stop-instances --instance-ids {instance_id} --region {region}", shell=True, check=True)
    except Exception as e:
        print(f"Failed to shutdown instance: {e}")

def main():
    idle_time_start = time.time()
    while True:
        queue_count = get_queue_count()
        print(f"Current queue count: {queue_count}")

        if queue_count > 0:
            # Reset idle timer if there are jobs
            idle_time_start = time.time()
            print("Jobs are in the queue. Resetting idle timer.")
        else:
            # If queue is empty, check how long it's been idle
            elapsed_idle_time = time.time() - idle_time_start
            print(f"Queue is empty. Idle for {int(elapsed_idle_time)} seconds.")
            if elapsed_idle_time > IDLE_TIMEOUT_SECONDS:
                shutdown_instance()
                break
        
        # Wait for a minute before checking again
        time.sleep(60)

if __name__ == '__main__':
    # Initial delay to allow the main service to start
    time.sleep(60)
    main()