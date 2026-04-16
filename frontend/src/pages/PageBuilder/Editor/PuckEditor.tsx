import React from "react";
import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";

const puckConfig: any = {
  components: {
    Text: {
      fields: {
        text: { type: "text" }
      },
      render: ({ text }: any) => <div>{text}</div>
    }
  }
};

const initialData: any = {
  root: { props: {} },
  content: [
    {
      type: "Text",
      props: { id: "text-1", text: "Hello from Puck Editor" }
    }
  ],
  zones: {}
};

export default function PuckEditor() {
  return (
    <div style={{ overflow: "auto" }}>
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={() => {
          // Wire this to persist data as needed
        }}
      />
    </div>
  );
}


