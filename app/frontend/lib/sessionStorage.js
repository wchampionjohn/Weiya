const PREFIX = 'lottery_';

export const sessionStorage = {
  setEventToken: (eventId, verified) => {
    window.sessionStorage.setItem(`${PREFIX}event_${eventId}`, verified ? 'verified' : '');
  },

  getEventToken: (eventId) => {
    return window.sessionStorage.getItem(`${PREFIX}event_${eventId}`) === 'verified';
  },

  clearEventToken: (eventId) => {
    window.sessionStorage.removeItem(`${PREFIX}event_${eventId}`);
  },

  setParticipant: (participant) => {
    window.sessionStorage.setItem(`${PREFIX}participant`, JSON.stringify(participant));
  },

  getParticipant: () => {
    const data = window.sessionStorage.getItem(`${PREFIX}participant`);
    return data ? JSON.parse(data) : null;
  },

  clearParticipant: () => {
    window.sessionStorage.removeItem(`${PREFIX}participant`);
  },

  clear: () => {
    Object.keys(window.sessionStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => window.sessionStorage.removeItem(key));
  },
};

export default sessionStorage;
