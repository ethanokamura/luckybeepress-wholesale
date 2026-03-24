// Email templates for Lucky Bee Press
// All templates include brand header/footer.

const BRAND_HEADER = `
<div style="padding: 24px; text-align: center; background: #FFF9ED; border-bottom: 2px solid #FFC72C;">
  <h1 style="margin: 0; font-size: 20px; color: #2D2A26;">Lucky Bee Press</h1>
  <p style="margin: 4px 0 0; font-size: 12px; color: #736B5E;">Handcrafted Letterpress Stationery</p>
</div>
`;

const BRAND_FOOTER = `
<div style="padding: 24px; text-align: center; font-size: 12px; color: #736B5E; border-top: 1px solid #E8E0D5; margin-top: 32px;">
  <p style="margin: 0;">Lucky Bee Press</p>
  <p style="margin: 4px 0 0;">luckybeepress@gmail.com</p>
  <p style="margin: 4px 0 0;">Handcrafted with care since 2008</p>
</div>
`;

function wrap(body: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2D2A26; background: #FFFFFF;">
      ${BRAND_HEADER}
      <div style="padding: 32px 24px;">
        ${body}
      </div>
      ${BRAND_FOOTER}
    </div>
  `;
}

export function applicationReceivedEmail(name: string): string {
  return wrap(`
    <p>Hi ${name},</p>
    <p>Thank you for applying for a wholesale account with Lucky Bee Press!</p>
    <p>We've received your application and will review it within 1-2 business days. You'll receive an email once your account is approved.</p>
    <p>If you have any questions, reply to this email.</p>
  `);
}

export function applicationApprovedEmail(
  name: string,
  loginUrl: string
): string {
  return wrap(`
    <p>Hi ${name},</p>
    <p>Great news — your wholesale account has been approved!</p>
    <p>You can now sign in and start browsing our catalog:</p>
    <p style="margin: 24px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: #FFC72C; color: #1A1815; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Browse Catalog
      </a>
    </p>
    <p>Welcome to the Lucky Bee Press family!</p>
  `);
}

export function applicationRejectedEmail(
  name: string,
  reason?: string
): string {
  return wrap(`
    <p>Hi ${name},</p>
    <p>Thank you for your interest in Lucky Bee Press wholesale.</p>
    <p>Unfortunately, we're unable to approve your wholesale account at this time.${reason ? ` ${reason}` : ""}</p>
    <p>If you have questions or believe this is an error, please reach out to us at luckybeepress@gmail.com.</p>
  `);
}

export function orderConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  items: { productName: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  shippingAddress: string;
}): string {
  const rows = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #E8E0D5;">${i.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E8E0D5; text-align: center;">${i.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E8E0D5; text-align: right;">$${(i.lineTotal / 100).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return wrap(`
    <p>Hi ${params.name},</p>
    <p>Thank you for your order!</p>
    <p style="font-size: 16px; font-weight: 600;">Order #${params.orderNumber}</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #FFF4D6;">
          <th style="padding: 8px; text-align: left; font-size: 12px;">Product</th>
          <th style="padding: 8px; text-align: center; font-size: 12px;">Qty</th>
          <th style="padding: 8px; text-align: right; font-size: 12px;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding: 4px 8px; text-align: right; font-size: 13px;">Subtotal</td><td style="padding: 4px 8px; text-align: right;">$${(params.subtotal / 100).toFixed(2)}</td></tr>
        ${params.discountAmount > 0 ? `<tr><td colspan="2" style="padding: 4px 8px; text-align: right; font-size: 13px; color: green;">Discount</td><td style="padding: 4px 8px; text-align: right; color: green;">-$${(params.discountAmount / 100).toFixed(2)}</td></tr>` : ""}
        <tr><td colspan="2" style="padding: 4px 8px; text-align: right; font-size: 13px;">Shipping</td><td style="padding: 4px 8px; text-align: right;">$${(params.shippingCost / 100).toFixed(2)}</td></tr>
        <tr><td colspan="2" style="padding: 8px 8px 4px; text-align: right; font-weight: 600; border-top: 2px solid #2D2A26;">Total</td><td style="padding: 8px 8px 4px; text-align: right; font-weight: 600; border-top: 2px solid #2D2A26;">$${(params.total / 100).toFixed(2)}</td></tr>
      </tfoot>
    </table>
    <p><strong>Ship to:</strong><br/>${params.shippingAddress}</p>
    <p>Estimated ship date: 3-5 business days.</p>
  `);
}

export function orderShippedEmail(params: {
  name: string;
  orderNumber: string;
  trackingNumber: string;
}): string {
  return wrap(`
    <p>Hi ${params.name},</p>
    <p>Your order <strong>#${params.orderNumber}</strong> has shipped!</p>
    <p><strong>Tracking number:</strong>
      <a href="https://track.aftership.com/${params.trackingNumber}" style="color: #F2A900;">
        ${params.trackingNumber}
      </a>
    </p>
    <p>Please allow 3-7 business days for delivery.</p>
  `);
}

export function orderCancelledEmail(params: {
  name: string;
  orderNumber: string;
  reason?: string;
  refundInfo?: string;
}): string {
  return wrap(`
    <p>Hi ${params.name},</p>
    <p>Your order <strong>#${params.orderNumber}</strong> has been cancelled.</p>
    ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ""}
    ${params.refundInfo ? `<p>${params.refundInfo}</p>` : ""}
    <p>If you have questions, please contact us.</p>
  `);
}

export function refundIssuedEmail(params: {
  name: string;
  orderNumber: string;
  amount: number;
  reason: string;
}): string {
  return wrap(`
    <p>Hi ${params.name},</p>
    <p>A refund of <strong>$${(params.amount / 100).toFixed(2)}</strong> has been issued for order <strong>#${params.orderNumber}</strong>.</p>
    <p><strong>Reason:</strong> ${params.reason}</p>
    <p>Please allow 5-10 business days for the refund to appear on your statement.</p>
  `);
}

export function welcomeAccountEmail(params: {
  name: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  return wrap(`
    <p>Hi ${params.name},</p>
    <p>A wholesale account has been created for you at Lucky Bee Press.</p>
    <p>Here are your login details:</p>
    <div style="background: #FFF9ED; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>Temporary password:</strong></p>
      <p style="margin: 0; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${params.tempPassword}</p>
    </div>
    <p>Please sign in and change your password as soon as possible.</p>
    <p style="margin: 24px 0;">
      <a href="${params.loginUrl}" style="display: inline-block; background: #FFC72C; color: #1A1815; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Sign In
      </a>
    </p>
    <p>Welcome to the Lucky Bee Press family!</p>
  `);
}

export function reorderWindowEmail(params: {
  name: string;
  lastOrderDate: string;
  reorderUrl: string;
  topItems: string[];
}): string {
  const itemList = params.topItems
    .map((i) => `<li style="margin: 4px 0;">${i}</li>`)
    .join("");

  return wrap(`
    <p>Hi ${params.name},</p>
    <p>Your last order was on ${params.lastOrderDate} — your best sellers may be running low!</p>
    ${itemList ? `<p><strong>Your top items:</strong></p><ul>${itemList}</ul>` : ""}
    <p style="margin: 24px 0;">
      <a href="${params.reorderUrl}" style="display: inline-block; background: #FFC72C; color: #1A1815; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Reorder Now
      </a>
    </p>
  `);
}
