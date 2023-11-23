import { Modal, message } from "antd";
import { useState } from "react";
import { createAuthRequest } from "src/adapters/api/credentials";
import { ReactComponent as IconClose } from "src/assets/icons/x.svg";
import { useEnvContext } from "src/contexts/Env";
import { Credential } from "src/domain";
import { CLOSE, VERIFY_IDENTITY } from "src/utils/constants";

export function CreateAuthRequestModal({
  credential,
  onClose,
}: {
  credential: Credential;
  onClose: () => void;
}) {
  const env = useEnvContext();

  const [messageAPI, messageContext] = message.useMessage();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateAuthRequest = () => {
    setIsLoading(true);

    const payload = {
      cred_id: credential.id,
    };
    void createAuthRequest({ env, payload }).then((response) => {
      if (response.success) {
        onClose();
        void messageAPI.success("verified");
      } else {
        void messageAPI.error(response.error.message);
      }

      setIsLoading(false);
    });
  };

  return (
    <>
      {messageContext}

      <Modal
        cancelText={CLOSE}
        centered
        closable
        closeIcon={<IconClose />}
        maskClosable
        okButtonProps={{ danger: true, loading: isLoading }}
        okText={VERIFY_IDENTITY}
        onCancel={onClose}
        onOk={handleCreateAuthRequest}
        open
        title="Are you sure you want to verify this identity?"
      >
        {/* <Space direction="vertical">
          <Typography.Text type="secondary">Are you Sure?</Typography.Text>
        </Space> */}
      </Modal>
    </>
  );
}
