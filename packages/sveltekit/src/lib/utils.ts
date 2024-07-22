export const isStringFormData = (input: FormDataEntryValue | null): input is string => {
	if (!input) return false;
	return typeof input === 'string';
};
