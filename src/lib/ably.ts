import * as Ably from 'ably';

// Generate a random client ID for this session if one doesn't exist
const getClientId = () => {
    if (typeof window === 'undefined') return 'server';

    let clientId = sessionStorage.getItem('nh_client_id');
    if (!clientId) {
        // Generate a random alphanumeric string
        clientId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        sessionStorage.setItem('nh_client_id', clientId);
    }
    return clientId;
};

// Initialize the Ably Realtime client using Token Auth
export const ablyClient = new Ably.Realtime({
    authUrl: '/api/ably-auth',
    authParams: {
        clientId: getClientId()
    },
    clientId: getClientId(),
    autoConnect: false // We will connect manually when needed
});
