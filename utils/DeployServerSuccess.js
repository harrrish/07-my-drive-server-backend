import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function serverDeploySuccess() {
  try {
    const { data, error } = await resend.emails.send({
      from: `My-Drive <no-reply@uvds.store>`,
      to: ["haridir150@gmail.com"],
      subject: "Deployment Successful !",
      html: `<h1>success</h1>`,
    });

    if (!data?.id) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error("Deployment-success error:", err);
    return {
      success: false,
      error: "Something went wrong !",
    };
  }
}
