import { Modal, message } from "antd";
import { useState } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { createAuthRequest } from "src/adapters/api/credentials";
import { ReactComponent as IconClose } from "src/assets/icons/x.svg";
import { useEnvContext } from "src/contexts/Env";
import { Request } from "src/domain";
import { ROUTES } from "src/routes";
import { CLOSE, VERIFY_IDENTITY } from "src/utils/constants";

export function CreateAuthRequestModal({
  onClose,
  request,
}: {
  onClose: () => void;
  request: Request;
}) {
  const navigate = useNavigate();
  const env = useEnvContext();

  const [messageAPI, messageContext] = message.useMessage();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreateAuthRequest = () => {
    setIsLoading(true);

    const payload = {
      cred_id: request.proof_id,
    };

    createAuthRequest({ env, payload })
      .then((response) => {
        if (response.success) {
          void navigate(
            generatePath(ROUTES.qrCodeDisplay.path.replace(":credentialID", request.proof_id)),
            { state: { data: response.data } }
          );
        } else {
          void messageAPI.error(response.error.message);
        }
        setIsLoading(false);
      })
      .catch((error) => console.log(error));
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
        onOk={() => void handleCreateAuthRequest()}
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
