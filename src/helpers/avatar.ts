import { GravatarQuickEditorCore } from "@gravatar-com/quick-editor";

const emailHashCache: { [key: string]: string } = {};

export async function getEmailHash(email: string): Promise<string> {
  if (!(email in emailHashCache)) {
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      encoder.encode(email.toLowerCase().trim())
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    emailHashCache[email] = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return emailHashCache[email];
}

export function launchGravatarEditor(email: string, onUpdate) {
  const quickEditorCore = new GravatarQuickEditorCore({
    email,
    scope: ["avatars"],
    onProfileUpdated: onUpdate,
  });
  quickEditorCore.open();
}
