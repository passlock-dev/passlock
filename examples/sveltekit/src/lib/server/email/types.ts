export type EmailMessage = {
	recipientEmail: string;
	subject: string;
	code?: string;
	body: {
		html: string;
		text: string;
	};
};

export type SendEmail = (input: EmailMessage) => Promise<void>;
