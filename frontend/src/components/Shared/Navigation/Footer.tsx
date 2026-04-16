import React from 'react';
import { useTheme } from '@mui/material/styles';

const Footer: React.FC = () => {
  const theme = useTheme();
  
  // Use the exact gradient colors from the original design
  const gradientBackground = 'linear-gradient(135deg, #7B7FD9 0%, #9B8FD9 25%, #B89FD9 50%, #9B8FD9 75%, #7B7FD9 100%)';

  return (
    <footer 
      className="w-full px-8 py-12"
      style={{
        backgroundColor: theme.palette.background.paper,
        fontFamily: theme.typography.fontFamily,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div 
        className="w-full text-white px-8 py-12"
        style={{
          background: gradientBackground,
          borderRadius: theme.shape.borderRadius * 2, // 16px for rounded-lg effect
          fontFamily: theme.typography.fontFamily,
          fontWeight: 600,
          fontSize: '18px', // Base font size increased by 2px from default 16px
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <a href="/">
            <img
              className="wwai_logo_svg"
              src="https://wwai-lp-serving-prod.s3.us-east-1.amazonaws.com/https:__e9440c_1f_myshopify_com_/shopify_72a2dbede1c29b6744e7678e410ab7babff73cc4bdbdf918961886f0f70fd017.svg?width=332"
              alt="Wordsworth AI"
            />
          </a>
        </div>

        {/* Address Section */}
        <div className="mb-6" style={{ fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          <p className="font-bold mb-1">Address:</p>
          <p className="opacity-95" style={{ fontWeight: 600 }}>
            16192 Coastal Highway, Lewes, Delaware, 19958, County of Sussex
          </p>
        </div>

        {/* Contact Section */}
        <div className="mb-6" style={{ fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          <p className="font-bold mb-1">Contact:</p>
          <a 
            href="mailto:contact@example.com" 
            className="opacity-95 hover:opacity-100 underline transition-opacity"
            style={{ fontWeight: 600 }}
          >
            contact@example.com
          </a>
        </div>

        {/* Social Media Icon */}
        <div className="mb-8">
          <a 
            href="#" 
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
              className="social_icon_image" 
              src="https://wwai-lp-serving-prod.s3.us-east-1.amazonaws.com/https:__e9440c_1f_myshopify_com_/shopify_c50fccd6042e4f4d35e1997ac9fbe6d8fec6bf9f7cfbce70a8c36921972f4486.svg?width=36&height=37&crop=center"
              alt="LinkedIn"
            />
          </a>
        </div>

        {/* Divider */}
        <div 
          className="my-8"
          style={{
            borderTop: '2px solid rgba(255, 255, 255, 0.5)',
          }}
        ></div>

        {/* Copyright */}
        <div className="mb-4" style={{ fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          <p className="font-bold">© WordsworthAl</p>
        </div>

        {/* Disclaimer */}
        <div style={{ fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          <p className="opacity-90 leading-relaxed" style={{ fontWeight: 600, fontSize: '16px' }}>
            <span className="font-bold">Disclaimer:</span> The information provided on this website is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no warranties or guarantees of any kind about the completeness, accuracy, reliability, or suitability of the software or information.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
