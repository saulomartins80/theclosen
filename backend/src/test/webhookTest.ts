import { stripe, STRIPE_CONFIG } from '../config/stripe';

async function testWebhook() {
    try {
        console.log('Testando webhook...');
        console.log('Webhook Secret:', STRIPE_CONFIG.webhookSecret);
        
        // Criar um evento de teste
        const event = await stripe.events.retrieve('evt_3RYurYQgQT6xG1Ui1xvH69yb');
        console.log('Evento recuperado:', event);

        // Verificar a assinatura
        const signature = 'whsec_a376bf298cdee9320bec852a27d86c435812176e459c384c420fc9033e5eccea';
        
        // Construir o evento
        const constructedEvent = await stripe.webhooks.constructEvent(
            JSON.stringify(event),
            signature,
            STRIPE_CONFIG.webhookSecret
        );
        
        console.log('Evento construído com sucesso:', constructedEvent);
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

testWebhook(); 