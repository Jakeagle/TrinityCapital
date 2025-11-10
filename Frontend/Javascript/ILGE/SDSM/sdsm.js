/* Frontend SDSM sender module
 * Responsible for sending student session data (active lessons, timers, student name)
 * to the backend SDSM endpoint.
 *
 * Endpoint used: http://localhost:4000/api/sdsm/session
 */

export async function sendStudentSessionData(payload) {
  try {
    console.log("SDSM: Sending session payload to server...", payload);

    const response = await fetch("http://localhost:4000/api/sdsm/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "SDSM: Server responded with non-OK status",
        response.status,
        text
      );
      return { ok: false, status: response.status, body: text };
    }

    const data = await response.json();
    console.log("SDSM: Server response OK", data);
    return { ok: true, data };
  } catch (err) {
    console.error("SDSM: Error sending session data", err);
    return { ok: false, error: err.message || err };
  }
}
