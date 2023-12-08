import { Space } from "antd";

import { NotificationsTable } from "./NotificationTable";
import { SiderLayoutContent } from "src/components/shared/SiderLayoutContent";

import { NOTIFICATION } from "src/utils/constants";

export function Notification() {
  return (
    <SiderLayoutContent title={NOTIFICATION}>
      <Space direction="vertical">
        <NotificationsTable />
      </Space>
    </SiderLayoutContent>
  );
}
