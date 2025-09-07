from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import os
import logging
from typing import Dict, Any
import hmac
import hashlib
import json
from server import supabase_admin, supabase_available

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Chapa webhook secret for signature verification
CHAPA_WEBHOOK_SECRET = os.environ.get('CHAPA_WEBHOOK_SECRET', '')

@router.post("/chapa/callback")
async def chapa_payment_callback(request: Request):
    """
    Handle Chapa payment webhook callbacks
    """
    try:
        if not supabase_available:
            raise HTTPException(status_code=503, detail="Database not available")

        # Get the raw body for signature verification
        body = await request.body()
        
        # Get the signature from headers
        signature = request.headers.get('chapa-signature', '')
        
        # Verify the signature if webhook secret is configured
        if CHAPA_WEBHOOK_SECRET:
            expected_signature = hmac.new(
                CHAPA_WEBHOOK_SECRET.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse the webhook data
        webhook_data = await request.json()
        
        # Extract payment information
        tx_ref = webhook_data.get('tx_ref', '')
        status = webhook_data.get('status', '')
        amount = webhook_data.get('amount', 0)
        
        logging.info(f"Chapa webhook received: tx_ref={tx_ref}, status={status}, amount={amount}")
        
        # Find the payment record by tx_ref
        { data: payment, error: payment_error } = await supabase_admin.table('payments').select('*').eq('tx_ref', tx_ref).single()
        
        if payment_error or not payment:
            logging.error(f"Payment not found for tx_ref: {tx_ref}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update payment status based on webhook
        payment_status = 'failed'
        if status == 'success':
            payment_status = 'completed'
        elif status == 'failed':
            payment_status = 'failed'
        elif status == 'cancelled':
            payment_status = 'cancelled'
        
        # Update payment record
        { error: update_error } = await supabase_admin.table('payments').update({
            'status': payment_status,
            'chapa_response': webhook_data,
            'updated_at': 'now()'
        }).eq('id', payment['id'])
        
        if update_error:
            logging.error(f"Error updating payment: {update_error}")
            raise HTTPException(status_code=500, detail="Failed to update payment")
        
        # Update task payment status
        { error: task_error } = await supabase_admin.table('tasks').update({
            'payment_status': payment_status,
            'updated_at': 'now()'
        }).eq('id', payment['task_id'])
        
        if task_error:
            logging.error(f"Error updating task payment status: {task_error}")
            # Don't fail the webhook for this, just log it
        
        # If payment is successful, you might want to:
        # 1. Send notification to tasker
        # 2. Update tasker earnings
        # 3. Send confirmation email to customer
        
        logging.info(f"Payment {tx_ref} updated to status: {payment_status}")
        
        return JSONResponse(content={"status": "success", "message": "Webhook processed"})
        
    except Exception as e:
        logging.error(f"Error processing Chapa webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/chapa/verify/{tx_ref}")
async def verify_chapa_payment(tx_ref: str):
    """
    Verify a Chapa payment status
    """
    try:
        if not supabase_available:
            raise HTTPException(status_code=503, detail="Database not available")

        # Get payment record
        { data: payment, error } = await supabase_admin.table('payments').select('*').eq('tx_ref', tx_ref).single()
        
        if error or not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "tx_ref": tx_ref,
            "status": payment['status'],
            "amount": payment['amount'],
            "currency": payment['currency'],
            "created_at": payment['created_at'],
            "updated_at": payment['updated_at']
        }
        
    except Exception as e:
        logging.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/chapa/initialize")
async def initialize_chapa_payment(payment_data: Dict[str, Any]):
    """
    Initialize a Chapa payment (for testing purposes)
    """
    try:
        # This endpoint can be used to test payment initialization
        # In production, this should be handled by the frontend
        
        return {
            "status": "success",
            "message": "Payment initialization endpoint",
            "data": payment_data
        }
        
    except Exception as e:
        logging.error(f"Error initializing payment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
