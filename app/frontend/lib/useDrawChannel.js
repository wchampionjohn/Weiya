import { useEffect, useCallback, useRef } from 'react';
import { createConsumer } from '@rails/actioncable';

const consumer = createConsumer();

export function useDrawChannel(eventId, onDrawResult, onBonusPrize) {
  const subscriptionRef = useRef(null);
  const callbackRef = useRef(onDrawResult);
  const bonusCallbackRef = useRef(onBonusPrize);

  useEffect(() => {
    callbackRef.current = onDrawResult;
  }, [onDrawResult]);

  useEffect(() => {
    bonusCallbackRef.current = onBonusPrize;
  }, [onBonusPrize]);

  useEffect(() => {
    if (!eventId) return;

    subscriptionRef.current = consumer.subscriptions.create(
      { channel: 'DrawChannel', event_id: eventId },
      {
        connected() {
          console.log('Connected to DrawChannel');
        },
        disconnected() {
          console.log('Disconnected from DrawChannel');
        },
        received(data) {
          console.log('Received draw data:', data);
          // Handle draw results and simulation results
          if ((data.type === 'draw_result' || data.type === 'simulation_result') && callbackRef.current) {
            callbackRef.current(data);
          }
          // Handle bonus prize added
          if (data.type === 'bonus_prize_added' && bonusCallbackRef.current) {
            bonusCallbackRef.current(data.prize);
          }
        },
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [eventId]);

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  return { disconnect };
}

export default useDrawChannel;
