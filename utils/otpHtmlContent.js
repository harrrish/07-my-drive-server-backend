export const generateOTPHtml = (username, OTP) => {
  return `<div
  style="
    max-width: 520px;
    margin: 40px auto;
    padding: 28px 32px;
    background: #ffffff;
    border-radius: 14px;
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    line-height: 1.5;
  "
>
  <h1
    style="
      margin: 0 0 16px;
      text-align: center;
      color: #2563eb;
      font-size: 26px;
      font-weight: 700;
    "
  >
    Welcome to UVDS My-Drive !
  </h1>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

  <p style="margin: 16px 0 8px; font-size: 16px;">
    Dear <strong style="color: #111827;">${username}</strong>,
  </p>

  <p style="margin: 0 0 20px; font-size: 14px; color: #374151;">
    Use the following One-Time Password (OTP) to complete your verification:
  </p>

  <div
    style="
      margin: 24px 0;
      padding: 18px;
      background: #f0f7ff;
      border: 1px dashed #2563eb;
      border-radius: 10px;
      text-align: center;
    "
  >
    <span
      style="
        display: block;
        font-size: 24px;
        letter-spacing: 6px;
        font-weight: 700;
        color: #2563eb;
      "
    >
${OTP}
    </span>
    <span
      style="
        display: block;
        margin-top: 8px;
        font-size: 12px;
        color: #475569;
      "
    >
      Valid for <strong>120 seconds</strong>
    </span>
  </div>

  <p style="margin: 0 0 20px; font-size: 14px; color: #374151;">
    For your security, do not share this OTP with anyone.
  </p>

  <p
    style="
      margin: 0 0 24px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    "
  >
    This is an automated message. Please do not reply to this email, as it is not monitored.
  </p>

  <p style="margin: 0; font-size: 14px;">
    Thank you,<br />
    <strong style="color: #2563eb;">Team UVDS</strong>
  </p>
</div>
`;
};
