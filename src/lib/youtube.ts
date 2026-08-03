/**
 * Extrae el ID de 11 caracteres de cualquier URL de YouTube (watch, shorts, embed, youtu.be, etc.)
 * o devuelve la cadena limpia si ya era solo un ID.
 */
export function extractYoutubeId(input?: string): string {
	if (!input) return '';
	const trimmed = input.trim();
	const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	const match = trimmed.match(regExp);
	if (match && match[2] && match[2].length === 11) {
		return match[2];
	}
	return trimmed;
}
