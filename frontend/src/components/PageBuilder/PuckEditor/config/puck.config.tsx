import type { Config } from "@measured/puck";

export const puckConfig: Config = {
  components: {
    Text: {
      fields: {
        text: {
          type: "text",
          label: "Text Content",
        },
        color: {
          type: "select",
          label: "Text Color",
          options: [
            { label: "Default", value: "text-gray-900" },
            { label: "Primary", value: "text-blue-600" },
            { label: "Secondary", value: "text-gray-600" },
            { label: "White", value: "text-white" },
          ],
        },
        size: {
          type: "select",
          label: "Text Size",
          options: [
            { label: "Small", value: "text-sm" },
            { label: "Base", value: "text-base" },
            { label: "Large", value: "text-lg" },
            { label: "Extra Large", value: "text-xl" },
            { label: "2XL", value: "text-2xl" },
          ],
        },
      },
      defaultProps: {
        text: "Enter your text here",
        color: "text-gray-900",
        size: "text-base",
      },
      render: ({ text, color, size }) => (
        <p className={`${color} ${size}`}>{text}</p>
      ),
    },
    Heading: {
      fields: {
        text: {
          type: "text",
          label: "Heading Text",
        },
        level: {
          type: "select",
          label: "Heading Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
            { label: "H5", value: "h5" },
            { label: "H6", value: "h6" },
          ],
        },
        color: {
          type: "select",
          label: "Text Color",
          options: [
            { label: "Default", value: "text-gray-900" },
            { label: "Primary", value: "text-blue-600" },
            { label: "Secondary", value: "text-gray-600" },
          ],
        },
      },
      defaultProps: {
        text: "Your Heading",
        level: "h2",
        color: "text-gray-900",
      },
      render: ({ text, level, color }) => {
        const Tag = level as keyof JSX.IntrinsicElements;
        return <Tag className={`${color} font-bold`}>{text}</Tag>;
      },
    },
    Container: {
      fields: {
        padding: {
          type: "select",
          label: "Padding",
          options: [
            { label: "None", value: "p-0" },
            { label: "Small", value: "p-4" },
            { label: "Medium", value: "p-6" },
            { label: "Large", value: "p-8" },
          ],
        },
        background: {
          type: "select",
          label: "Background",
          options: [
            { label: "White", value: "bg-white" },
            { label: "Gray", value: "bg-gray-50" },
            { label: "Blue", value: "bg-blue-50" },
            { label: "Transparent", value: "bg-transparent" },
          ],
        },
        rounded: {
          type: "select",
          label: "Border Radius",
          options: [
            { label: "None", value: "rounded-none" },
            { label: "Small", value: "rounded" },
            { label: "Medium", value: "rounded-lg" },
            { label: "Large", value: "rounded-xl" },
          ],
        },
      },
      defaultProps: {
        padding: "p-6",
        background: "bg-white",
        rounded: "rounded-lg",
      },
      render: ({ padding, background, rounded, children }) => (
        <div className={`${padding} ${background} ${rounded}`}>{children}</div>
      ),
    },
    Button: {
      fields: {
        text: {
          type: "text",
          label: "Button Text",
        },
        variant: {
          type: "select",
          label: "Button Style",
          options: [
            { label: "Primary", value: "bg-blue-600 hover:bg-blue-700 text-white" },
            { label: "Secondary", value: "bg-gray-600 hover:bg-gray-700 text-white" },
            { label: "Outline", value: "border border-gray-300 hover:bg-gray-50 text-gray-700" },
          ],
        },
        size: {
          type: "select",
          label: "Button Size",
          options: [
            { label: "Small", value: "px-3 py-2 text-sm" },
            { label: "Medium", value: "px-4 py-2" },
            { label: "Large", value: "px-6 py-3 text-lg" },
          ],
        },
      },
      defaultProps: {
        text: "Click me",
        variant: "bg-blue-600 hover:bg-blue-700 text-white",
        size: "px-4 py-2",
      },
      render: ({ text, variant, size }) => (
        <button className={`${variant} ${size} rounded font-medium transition-colors`}>
          {text}
        </button>
      ),
    },
    Image: {
      fields: {
        src: {
          type: "text",
          label: "Image URL",
        },
        alt: {
          type: "text",
          label: "Alt Text",
        },
        width: {
          type: "select",
          label: "Width",
          options: [
            { label: "Auto", value: "w-auto" },
            { label: "Full", value: "w-full" },
            { label: "Small", value: "w-32" },
            { label: "Medium", value: "w-64" },
            { label: "Large", value: "w-96" },
          ],
        },
        rounded: {
          type: "select",
          label: "Border Radius",
          options: [
            { label: "None", value: "rounded-none" },
            { label: "Small", value: "rounded" },
            { label: "Medium", value: "rounded-lg" },
            { label: "Full", value: "rounded-full" },
          ],
        },
      },
      defaultProps: {
        src: "https://via.placeholder.com/400x300",
        alt: "Placeholder image",
        width: "w-full",
        rounded: "rounded-lg",
      },
      render: ({ src, alt, width, rounded }) => (
        <img src={src} alt={alt} className={`${width} ${rounded} object-cover`} />
      ),
    },
  },
  zones: {
    root: {
      title: "Root",
    },
  },
};
