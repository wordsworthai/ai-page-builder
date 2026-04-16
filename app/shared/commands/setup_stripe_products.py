"""
Script to create Stripe test products for local development and testing.
Run this script to set up all the products defined in your payment config.
"""

import stripe

from app.shared.config.payments import payment_config

# Register page_builder plans so payment_config.products is populated
from app.products.page_builder.config.plans import register as register_pb_plans
register_pb_plans()

def setup_stripe_products():
    """Create all products and prices in Stripe test mode"""
    
    # Set Stripe API key
    stripe.api_key = payment_config.stripe.api_key
    
    if not stripe.api_key or "placeholder" in stripe.api_key:
        print("❌ Error: Please set your real Stripe test API key in local.env")
        print("   STRIPE_SECRET_KEY=sk_test_your_actual_key_here")
        return
    
    print("🔧 Setting up Stripe test products...")
    created_products = []
    
    for product_id, product_config in payment_config.products.items():
        try:
            print(f"\n📦 Creating product: {product_config.name}")
            
            # Create product
            stripe_product = stripe.Product.create(
                name=product_config.name,
                description=product_config.description,
                metadata={
                    "boilerplate_id": product_id,
                    "type": product_config.type,
                }
            )
            
            # Create price
            price_data = {
                "product": stripe_product.id,
                "unit_amount": product_config.price_cents,
                "currency": product_config.currency,
            }
            
            if product_config.type == "subscription":
                interval = "year" if "yearly" in product_id else "month"
                price_data["recurring"] = {"interval": interval}
            
            stripe_price = stripe.Price.create(**price_data)
            
            created_products.append({
                "name": product_config.name,
                "boilerplate_id": product_id,
                "price_id": stripe_price.id,
                "product_id": stripe_product.id,
                "type": product_config.type,
                "amount": product_config.price_cents / 100
            })
            
            print(f"   ✅ Product ID: {stripe_product.id}")
            print(f"   ✅ Price ID: {stripe_price.id}")
            print(f"   💰 Amount: ${product_config.price_cents / 100}")
            
        except stripe.StripeError as e:
            print(f"   ❌ Error creating {product_config.name}: {e}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
    
    print("\n" + "="*50)
    print("🎉 Stripe products created successfully!")
    print("="*50)
    
    print("\n📋 Update your local.env / prod.env with these price IDs:")
    for product in created_products:
        # Map product IDs to environment variable names
        id_mapping = {
            "basic": "STRIPE_PRICE_PB_BASIC",
            "credits-100": "STRIPE_PRICE_PB_CREDITS_100",
        }
        env_var = id_mapping.get(
            product.get("boilerplate_id", ""),
            f"STRIPE_PRICE_PB_{product['name'].upper().replace(' ', '_').replace('(', '').replace(')', '')}"
        )
        print(f"{env_var}={product['price_id']}")
    
    print("\n🧪 Test card numbers:")
    print("   Success: 4242 4242 4242 4242")
    print("   Decline: 4000 0000 0000 0002")
    print("   Insufficient funds: 4000 0000 0000 0341")
    print("   Use any future date for expiry and any 3-digit CVC")
    
    return created_products

if __name__ == "__main__":
    setup_stripe_products()
