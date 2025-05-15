import * as React from 'react';
import { 
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Tailwind,
} from '@react-email/components';

interface EmailTemplateProps {
  username: string;
  otp: string;
  productName: string;
  isPasswordReset?: boolean;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  username,
  otp,
  productName,
  isPasswordReset = false,
}) => {
  const previewText = isPasswordReset 
    ? `Reset your ${productName} password` 
    : `Verify your ${productName} account`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded-lg border border-solid border-gray-200 bg-white p-10">
            <Heading as="h1" className="text-2xl font-bold text-gray-800 text-center">
              {isPasswordReset ? 'Reset your password' : 'Verify your account'}
            </Heading>
            <Section className="my-8">
              <Text className="text-gray-700">Hello {username},</Text>
              <Text className="text-gray-700">
                {isPasswordReset 
                  ? `We received a request to reset your password for your ${productName} account.` 
                  : `Thank you for registering with ${productName}. To complete your registration, please verify your email address.`}
              </Text>
              <Text className="my-4 text-center text-2xl font-bold tracking-wide">
                {otp.split('').map((char, i) => (
                  <span 
                    key={i} 
                    className="inline-block mx-1 px-3 py-2 rounded-md bg-gray-100 border border-gray-300"
                  >
                    {char}
                  </span>
                ))}
              </Text>
              <Text className="text-gray-700 text-center text-sm">
                {isPasswordReset
                  ? 'Enter this code to reset your password.' 
                  : 'Enter this code to verify your account.'}
              </Text>
              <Text className="text-gray-700 text-sm">
                This code will expire in 15 minutes.
              </Text>
            </Section>
            <Hr className="border-t border-gray-300 my-6" />
            <Text className="text-xs text-gray-500 text-center">
              If you didn&apos;t request this, you can safely ignore this email.
            </Text>
            <Text className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} {productName}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};