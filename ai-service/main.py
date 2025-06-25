# FILE: ai-service/main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse, JSONResponse # Add JSONResponse
import uvicorn
import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from PIL import Image, ImageFilter
import io

# --- Model Setup (remains the same) ---
print("Loading models, this may take a while...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
torch_dtype = torch.float16 if device == "cuda" else torch.float32
controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny", torch_dtype=torch_dtype)
pipe = StableDiffusionControlNetPipeline.from_pretrained("runwayml/stable-diffusion-v1-5", controlnet=controlnet, torch_dtype=torch_dtype)
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

pipe.to(device)
print("Models loaded successfully.")
# --- End Model Setup ---

app = FastAPI()

# --- NEW: Health Check Endpoint ---
@app.get("/health")
async def health_check():
    # This endpoint will only be reachable after the models are loaded and Uvicorn starts.
    return JSONResponse(content={"status": "ok"})


@app.post("/generate-art")
async def generate_art(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form(...)
):
    # This logic remains the same
    image_data = await image.read()
    input_image = Image.open(io.BytesIO(image_data)).convert("RGB")
    input_image_l = input_image.convert("L")
    canny_image = input_image_l.filter(ImageFilter.FIND_EDGES)
    print(f"Using prompt: {prompt}")
    generator = torch.manual_seed(0)
    generated_image = pipe(
        prompt,
        num_inference_steps=20,
        generator=generator,
        image=canny_image,
        negative_prompt=negative_prompt,
        controlnet_conditioning_scale=0.5,
    ).images[0]
    print("Artwork generated.")
    buffer = io.BytesIO()
    generated_image.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)