import { GravatarQuickEditorCore } from "@gravatar-com/quick-editor";

export async function getEmailHash(email) {
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    encoder.encode(email.toLowerCase().trim())
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function launchGravatarEditor(email, onUpdate) {
  const quickEditorCore = new GravatarQuickEditorCore({
    email,
    scope: ["avatars"],
    onProfileUpdated: onUpdate,
  });
  quickEditorCore.open();
}
