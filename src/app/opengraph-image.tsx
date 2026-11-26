import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/constants';

export const alt = `${SITE_NAME} — Find local home service providers`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#FFFFFF',
        color: '#020618'
      }}
    >
      <div style={{ fontSize: 28, color: '#62748E', display: 'flex' }}>
        Local services, human-reviewed
      </div>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.05,
          marginTop: 24,
          display: 'flex'
        }}
      >
        Find a local pro for your next home project.
      </div>
      <div
        style={{
          fontSize: 34,
          color: '#62748E',
          marginTop: 32,
          display: 'flex'
        }}
      >
        Plumbing · Electrical · Handyman
      </div>
      <div
        style={{
          marginTop: 56,
          display: 'flex',
          alignItems: 'center',
          fontSize: 30,
          fontWeight: 600
        }}
      >
        <div
          style={{
            background: '#135858',
            color: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: 12,
            display: 'flex'
          }}
        >
          Request a provider →
        </div>
      </div>
    </div>,
    { ...size }
  );
}
