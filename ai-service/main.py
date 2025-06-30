# FILE: ai-service/main.py
import runpod
import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from PIL import Image, ImageFilter
import io
import base64

# This setup code runs only once when RunPod starts a new worker.
print("Loading models...")
device = "cuda"
torch_dtype = torch.float16
controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny", torch_dtype=torch_dtype)
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", controlnet=controlnet, torch_dtype=torch_dtype
)
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
pipe.to(device)
print("Models loaded successfully.")

def handler(job):
    """
    This is the handler function that RunPod will call for each job.
    """
    job_input = job['input']

    # Extract data from the job input
    prompt = job_input.get('prompt')
    negative_prompt = job_input.get('negative_prompt')
    image_b64 = job_input.get('image')

    if not all([prompt, negative_prompt, image_b64]):
        return {"error": "Missing required input fields."}

    # Process the image
    image_data = base64.b64decode(image_b64)
    input_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    input_image_l = input_image.convert("L")
    canny_image = input_image_l.filter(ImageFilter.FIND_EDGES)

    print(f"Using prompt: {prompt}")
    generator = torch.manual_seed(0)

    # Generate the new artwork
    generated_image = pipe(
        prompt,
        num_inference_steps=20,
        generator=generator,
        image=canny_image,
        negative_prompt=negative_prompt,
        controlnet_conditioning_scale=0.5,
    ).images[0]
    print("Artwork generated.")

    # Convert the output image to a base64 string for the JSON response
    buffer = io.BytesIO()
    generated_image.save(buffer, format="PNG")
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return {"image_base64": img_str}

# Start the RunPod serverless worker
runpod.serverless.start({"handler": handler})