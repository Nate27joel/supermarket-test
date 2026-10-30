import { Order, OrderStatus, SmsNotification } from '../types';
import { formatPrice } from '../constants';

const NIGERIAN_CARRIERS = [
  'MTN Nigeria (Gateway 30891)',
  'Airtel NG (Shortcode NUELIXX-NG)',
  'Glo Mobile Nigeria'
];

/**
 * Generates an authentic simulated SMS notification for order status transitions.
 */
export function generateOrderSms(order: Order, newStatus: OrderStatus): SmsNotification {
  const firstName = order.deliveryAddress?.fullName?.split(' ')[0] || 'Valued Shopper';
  const riderName = order.trackingInfo?.riderName || 'Chinedu Ebere';
  const riderPhone = order.trackingInfo?.riderPhone || '+234 812 901 3456';
  const riderVehicle = order.trackingInfo?.riderVehicle || 'Express Courier Dispatch (Plate: LAG-428-NX)';
  const area = order.deliveryAddress?.area || 'Delivery Destination';
  const state = order.deliveryAddress?.state ? `, ${order.deliveryAddress.state}` : '';
  const street = order.deliveryAddress?.street || 'Your address';
  const recipientPhone = order.deliveryAddress?.phone || '+234 803 456 7890';
  const carrier = NIGERIAN_CARRIERS[Math.floor(Math.random() * NIGERIAN_CARRIERS.length)];

  let message = '';

  switch (newStatus) {
    case 'Order Confirmed':
    case 'Confirmed':
      message = `Nuelixx Supermarket: Hello ${firstName}, Order #${order.id} (${formatPrice(order.total)}) is CONFIRMED! Our team at the central fulfillment hub is packing your fresh items for ${area}${state}. Track live: nuelixx.ng/track/${order.id}`;
      break;

    case 'Picking Items':
    case 'Packing':
      message = `Nuelixx Supermarket: Order #${order.id} is now being PICKED FRESH from cold storage shelves. Produce quality inspected. Estimated delivery: ~35 mins.`;
      break;

    case 'Out for Delivery':
      message = `Nuelixx Supermarket: DISPATCHED! Dispatch courier ${riderName} (${riderVehicle}) is en route to ${street}, ${area}${state}. Estimated arrival: ~15 mins. Courier Tel: ${riderPhone}`;
      break;

    case 'Delivered':
      message = `Nuelixx Supermarket: Order #${order.id} has been DELIVERED safely to your doorstep! Thank you for choosing Nuelixx. Rate your delivery at nuelixx.ng/rate/${order.id}`;
      break;

    case 'Cancelled':
      message = `Nuelixx Supermarket: Order #${order.id} has been CANCELLED upon request. Any pre-authorized charges will reverse to your bank within 2 hours. Helpline: 0803-456-7890`;
      break;

    default:
      message = `Nuelixx Supermarket: Order #${order.id} status updated to "${newStatus}". Contact support at 0803-456-7890 for inquiries.`;
      break;
  }

  return {
    id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: order.id,
    recipientPhone,
    recipientName: order.deliveryAddress?.fullName || firstName,
    status: newStatus,
    message,
    timestamp: 'Just now',
    carrier
  };
}
