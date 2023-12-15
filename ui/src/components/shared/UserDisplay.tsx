import { Avatar, Row, Space, Typography } from "antd";
import { useEnvContext } from "src/contexts/Env";

export function UserDisplay() {
  const { issuer } = useEnvContext();
  const User = localStorage.getItem("user");
  //  console.log(User);
  const OrgName = localStorage.getItem("OrganizationName");

  return (
    <Space>
      <Avatar shape="square" size="large" src={issuer.logo} />

      <Row>
        <Typography.Text className="font-small" ellipsis strong>
          {User === "verifier" ? OrgName : User === "issuer" ? "CCL" : "User"}
        </Typography.Text>
      </Row>
    </Space>
  );
}
