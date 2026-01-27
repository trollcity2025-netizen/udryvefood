# QA Checklist

## 1. Distance-Based Delivery Fee
- [ ] **Place Order**: Create a new order from a customer account.
- [ ] **Route Computation**: Verify that `route_distance_miles` is calculated using Google Maps API.
- [ ] **Fee Calculation**: Check that `distance_fee` is `ceil(miles * 10) / 10 * 0.50`.
- [ ] **Total Fee**: Ensure `delivery_fee` = `base_delivery_fee` + `distance_fee`.
- [ ] **Driver Payout**: Verify driver receives 100% of `delivery_fee`.

## 2. Driver Route Compliance
- [ ] **Route Display**: Driver sees the recommended route map.
- [ ] **Off-Route Detection**: Simulate driver location deviation (> 0.3 miles or > 2 mins).
- [ ] **Bypass Prompt**: Verify "Off Route" modal appears.
- [ ] **Bypass Submission**: Submit a bypass report with reason, notes, and photo.
- [ ] **Admin View**: Admin can view the route deviation and submitted bypass report on the order detail page.

## 3. Admin Controls
- [ ] **Hold Payout**: Admin puts a hold on a specific order's driver payout.
  - [ ] Verify `payout_hold` is set to `true`.
  - [ ] Verify earnings are excluded from driver's available balance.
  - [ ] Verify driver sees "Earnings on hold" in wallet.
- [ ] **Freeze Driver Payouts**: Admin freezes a driver's payouts.
  - [ ] Verify `payout_frozen` is set to `true`.
  - [ ] Verify driver cannot initiate cash-out.
  - [ ] Verify auto-payouts are blocked.
- [ ] **Freeze Driver Account**: Admin freezes a driver's account.
  - [ ] Verify `account_frozen` is set to `true`.
  - [ ] Verify driver cannot accept new orders.
- [ ] **Refund Customer**: Admin refunds a customer.
  - [ ] Verify refund is recorded in `refunds` table.
  - [ ] Verify audit log entry is created.

## 4. Security & Audit
- [ ] **Permissions**: Verify only Admins can access hold/freeze/refund actions.
- [ ] **Audit Logs**: Check `audit_logs` table for records of all admin actions.
