from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import time
from models import Product, PaymentRequest, ChatRequest, ContactRequest
from typing import List
import os

app = FastAPI(title="AURELIA API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Products
products = [
    Product(id=1, name="Silk Evening Gown", price=1200.0, imageUrl="https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=400&auto=format&fit=crop"),
    Product(id=2, name="Cashmere Oversized Coat", price=2500.0, imageUrl="https://images.unsplash.com/photo-1539533397308-a61f4ef3c7a2?q=80&w=400&auto=format&fit=crop"),
    Product(id=3, name="Italian Leather Handbag", price=1800.0, imageUrl="https://images.unsplash.com/photo-1584917033904-4911783b09d7?q=80&w=400&auto=format&fit=crop"),
    Product(id=4, name="Velvet Tuxedo Blazer", price=950.0, imageUrl="https://images.unsplash.com/photo-1594932224828-b4b05a832c02?q=80&w=400&auto=format&fit=crop"),
    Product(id=5, name="Crystal Embellished Heels", price=850.0, imageUrl="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400&auto=format&fit=crop"),
    Product(id=6, name="Pearl Drop Earrings", price=650.0, imageUrl="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400&auto=format&fit=crop"),
    Product(id=7, name="Silk Scarf Collection", price=320.0, imageUrl="https://images.unsplash.com/photo-1601762603332-db5e4b90cc5d?q=80&w=400&auto=format&fit=crop"),
    Product(id=8, name="Designer Sunglasses", price=750.0, imageUrl="https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=400&auto=format&fit=crop"),]

@app.get("/products", response_model=List[Product])
async def get_products():
    return products

@app.post("/process-payment")
async def process_payment(request: PaymentRequest):
    time.sleep(2)  # Simulate 2-second delay
    return {"status": "Payment Successful", "transaction_id": "AUR-123456"}

@app.post("/chat")
async def chat(request: ChatRequest):
    message = request.message.lower()
    
    # AI Concierge Keyword Logic
    if "material" in message or "fabric" in message:
        response = "Our collection is crafted from the finest Italian silk, hand-sourced cashmere, and ethically harvested Egyptian cotton. Quality is the cornerstone of AURELIA."
    elif "shipping" in message or "delivery" in message:
        response = "We offer complimentary white-glove delivery worldwide. Orders within the EU typically arrive within 48 hours, while international shipments take 3-5 business days."
    elif "price" in message or "cost" in message:
        response = "AURELIA represents an investment in timeless elegance. Our pricing reflects the unparalleled craftsmanship and rare materials used in every piece."
    elif "collection" in message or "selection" in message or "curated" in message or "new arrivals" in message:
        response = "Our latest collection blends evening glamour with contemporary tailoring. Explore Moonlit Gala, Modern Atelier and Signature Staples for considered luxury at every moment."
    elif "size" in message or "sizing" in message:
        response = "Each piece is meticulously tailored. We offer complimentary alterations and personal styling consultations. Our sizes range from XS to XXL with custom options available."
    elif "care" in message or "maintenance" in message:
        response = "Our garments deserve the finest care. We recommend professional dry cleaning for most items. Detailed care instructions are included with each purchase."
    elif "return" in message or "exchange" in message:
        response = "We offer a 30-day return policy with complimentary return shipping. All items must be in original condition with tags attached."
    elif "hello" in message or "hi" in message or "greetings" in message:
        response = "Welcome to AURELIA. I am your personal concierge. How may I assist you in curating your wardrobe today?"
    elif "thank" in message:
        response = "It is my pleasure to serve you. AURELIA exists to bring exceptional luxury into your life."
    elif "bye" in message or "goodbye" in message:
        response = "Thank you for choosing AURELIA. We look forward to welcoming you back soon."
    else:
        response = "I understand. Our artisans pay meticulous attention to detail. Would you like to know more about our current season's inspirations or our bespoke tailoring services?"

    return {"response": response}

@app.post("/contact-submit")
async def contact_submit(request: ContactRequest):
    return {"message": f"Thank you, {request.name}. Your inquiry regarding '{request.subject}' has been received by our concierge team."}

# Serve static files from the frontend directory
# Note: mount should be last or specific paths should be used to avoid overlapping with API routes
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
