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
        badge_subtitle: 'NOTIFICACIÓN PARA EL ADMINISTRADOR',
        heading_title: 'Nueva Solicitud de Libro',
        intro_text: 'Un alumno ha solicitado un libro en préstamo a través de la Biblioteca Digital de UTSC Salud:',
        student_email: studentEmail,
        book_title: bookTitle,
        request_date: requestDate,
        token_label: 'Estado',
        pickup_token: 'Pendiente de apartar',
        footer_text: 'Ingresa al panel de administración para autorizar o rechazar esta solicitud:',
        button_text: 'IR AL PANEL DE ADMIN',
        button_url: 'https://biblioteca-utsc.web.app/admin',
        message: `El alumno ${studentEmail} ha solicitado el libro "${bookTitle}" el ${requestDate}.`,
      },
    }),
  })
  if (!res.ok) throw new Error('Fallo el envio de notificacion de prestamo')
  return res.json()
}

export async function sendPickupTokenEmail({ studentEmail, bookTitle, pickupToken, approvalDate }) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: EMAILJS_CONFIG.loanTemplateId,
      user_id: EMAILJS_CONFIG.publicKey,
      template_params: {
        to_email: studentEmail,
        to_name: studentEmail,
        badge_subtitle: 'NOTIFICACIÓN DE RECOLECCIÓN',
        heading_title: '¡Tu libro está listo para recoger!',
        intro_text: 'Tu solicitud fue autorizada. Presenta el siguiente Token junto con tu credencial física UTSC en ventanilla:',
        student_email: studentEmail,
        book_title: bookTitle,
        request_date: approvalDate,
        token_label: 'Token de recolección',
        pickup_token: pickupToken,
        footer_text: 'Recuerda: Sin este token y tu credencial física UTSC con fotografía no se entregará el ejemplar.',
        button_text: 'VER CATÁLOGO EN LÍNEA',
        button_url: 'https://biblioteca-utsc.web.app/biblioteca',
        message: `Tu solicitud para el libro "${bookTitle}" fue aprobada. Tu token de recolección es: ${pickupToken}. Acude a ventanilla con este código y tu credencial física UTSC.`,
      },
    }),
  })
  if (!res.ok) throw new Error('Fallo el envio de token de recoleccion')
  return res.json()
}
