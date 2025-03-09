export default function useAnalytics() {
    const trackEvent = (event) => {
        console.log(`Event tracked: ${event}`);
    };
    return { trackEvent };
}
