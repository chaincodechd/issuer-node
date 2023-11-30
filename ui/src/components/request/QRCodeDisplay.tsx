import { Avatar, Card, Col, Grid, Image, Row, Space, Typography } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { useLocation } from "react-router-dom";

import { useEnvContext } from "src/contexts/Env";
import { WALLET_APP_STORE_URL, WALLET_PLAY_STORE_URL } from "src/utils/constants";

export function QRCodeDisplay() {
  const location = useLocation();
  {
    /* eslint-disable */
  }
  const qrCodeData = location?.state;
  {
    /* eslint-disable */
  }
  const { issuer } = useEnvContext();
  console.log(location.state);

  const { lg } = Grid.useBreakpoint();
  return (
    <Space align="center" direction="vertical" size="large">
      <Avatar shape="square" size={64} src={issuer.logo} />

      <Space
        direction="vertical"
        style={{ padding: "0 24px", textAlign: "center", width: lg ? 800 : "100%" }}
      >
        <Typography.Title level={2}>HDFC wants you to verify the credential</Typography.Title>

        <Typography.Text style={{ fontSize: 18 }} type="secondary">
          Scan the QR code with your Polygon ID wallet to verify the credential.
        </Typography.Text>
      </Space>

      <Space>
        <Typography.Link href={WALLET_APP_STORE_URL} target="_blank">
          <Image preview={false} src="/images/apple-store.svg" />
        </Typography.Link>

        <Typography.Link href={WALLET_PLAY_STORE_URL} target="_blank">
          <Image preview={false} src="/images/google-play.svg" />
        </Typography.Link>
      </Space>

      <Card bodyStyle={{ padding: 0 }} style={{ margin: "auto", width: lg ? 800 : "100%" }}>
        <Row>
          <Col
            className="full-width"
            style={{
              background:
                'url("/images/noise-bg.png"), linear-gradient(50deg, rgb(130 101 208) 0%, rgba(221, 178, 248, 1) 50%',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <QRCodeSVG
              className="full-width"
              includeMargin
              level="H"
              style={{ height: 300 }}
              value={qrCodeData ? JSON.stringify(qrCodeData) : ""}
            />
          </Col>
        </Row>

        <Row>
          <Col
            style={{
              padding: 24,
              paddingBottom: 8,
            }}
          >
            <Typography.Title ellipsis={{ tooltip: true }} level={3}></Typography.Title>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
