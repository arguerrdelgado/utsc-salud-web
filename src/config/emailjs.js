const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  loanTemplateId: import.meta.env.VITE_EMAILJS_LOAN_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  adminNotifyEmail: import.meta.env.VITE_ADMIN_NOTIFY_EMAIL || 'ingeniebrocervezatecate@gmail.com',
}

// REST directo (sin SDK) para evitar conflictos de ESM en build
export async function sendWelcomeEmail({ toEmail, toName }) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: EMAILJS_CONFIG.templateId,
      user_id: EMAILJS_CONFIG.publicKey,
      template_params: { to_email: toEmail, to_name: toName },
    }),
  })
  if (!res.ok) throw new Error('Fallo el envio de correo')
  return res.json()
}

export async function sendLoanRequestEmail({ studentEmail, bookTitle, requestDate }) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: EMAILJS_CONFIG.loanTemplateId,
      user_id: EMAILJS_CONFIG.publicKey,
      template_params: {
        to_email: EMAILJS_CONFIG.adminNotifyEmail,
        to_name: 'Administrador UTSC Salud',
        student_email: studentEmail,
        book_title: bookTitle,
        request_date: requestDate,
        message: `El alumno ${studentEmail} ha solicitado el libro "${bookTitle}" el ${requestDate}.`,
      },
    }),
  })
  if (!res.ok) throw new Error('Fallo el envio de notificacion de prestamo')
  return res.json()
}
