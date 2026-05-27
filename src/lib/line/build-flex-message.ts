// ================================================================
// LINE Flex Message ペイロード組み立て — 純粋関数
// ================================================================

export type FlexMessagePayload = {
  type: "flex";
  altText: string;
  contents: object;
};

export function buildFlexMessage({
  bodyText,
  customerName,
  recipientId,
}: {
  bodyText: string;
  customerName: string;
  recipientId: string;
}): FlexMessagePayload {
  return {
    type: "flex",
    altText: `${customerName}様へのご連絡です`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "xl",
        contents: [
          {
            type: "text",
            text: bodyText,
            wrap: true,
            size: "sm",
            color: "#1a1a2e",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "xl",
        contents: [
          {
            type: "button",
            action: {
              type: "message",
              label: "予約する",
              text: "予約する",
            },
            style: "primary",
            color: "#C97B5F",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "今回はパス",
              text: "今回はパス",
            },
            style: "secondary",
          },
        ],
      },
    },
  };
}
