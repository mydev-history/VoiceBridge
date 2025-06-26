const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase');

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        console.warn('Missing Stripe signature');
        return res.status(400).send('Missing Stripe signature');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('Stripe event:', event.data.object);
    } catch (err) {
        console.error('Stripe signature validation failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        try {
            const session = event.data.object;
            const customerEmail = session.customer_details.email;
            // Determine plan based on price (in cents)
            const planTier = session.amount_total === 1999 ? 'silver' : 'gold';

            // Lookup caregiver
            const { data: caregiver, error: lookupError } = await supabase
                .from('caregivers')
                .select('id')
                .eq('email', customerEmail)
                .single();

            if (lookupError || !caregiver) {
                console.warn('Caregiver not found for email:', customerEmail);
                return res.status(404).json({ error: 'Caregiver not found' });
            }

            // Update plan_tier
            const { error: updateError } = await supabase
                .from('caregivers')
                .update({ plan_tier: planTier })
                .eq('email', customerEmail);

            if (updateError) {
                console.error('Supabase update error:', updateError.message);
                return res.status(500).json({ error: 'Failed to update plan tier' });
            }

            return res.json({ success: true });
        } catch (err) {
            console.error('Unexpected webhook processing error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Gracefully ignore unrelated events
    res.status(200).json({ received: true });
};

module.exports = {
    handleStripeWebhook
};