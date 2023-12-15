import { Button, Modal, message } from "antd";
import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { cancelVerificationRequest, createAuthRequest } from "src/adapters/api/credentials";
import { ReactComponent as IconClose } from "src/assets/icons/x.svg";
import { useEnvContext } from "src/contexts/Env";
import { Request } from "src/domain";
// import { ROUTES } from "src/routes";
// import { CLOSE } from "src/utils/constants";

export function CreateAuthRequestModal({
  onClose,
  request,
}: {
  onClose: () => void;
  request: Request;
}) {
  // const navigate = useNavigate();
  const env = useEnvContext();
  // console.log(request.id);

  const [messageAPI, messageContext] = message.useMessage();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNoLoading, setIsNoLoading] = useState<boolean>(false);

  const handleCreateAuthRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      const payload = {
        cred_id: request.proof_id,
        request_id: request.id,
      };

      createAuthRequest({ env, payload })
        .then((response) => {
          if (response.success) {
            void messageAPI.success("Credential Verified Successfully").then(() => onClose());
            // void navigate(
            //   generatePath(ROUTES.qrCodeDisplay.path.replace(":credentialID", request.proof_id)),
            //   { state: { data: response.data } }
            // );
          } else {
            void messageAPI.error("Credential Verification failed");
          }
          setIsLoading(false);
        })
        .catch((error) => console.log(error));
    }, 5000);
  };

  const handleCancel = () => {
    setIsNoLoading(true);
    setTimeout(() => {
      cancelVerificationRequest({
        env,
        id: request.id,
      })
        .then((response) => {
          if (response.success) {
            void messageAPI.success("Verification Rejected Successfully").then(() => onClose());
          } else {
            void messageAPI.error("Failed to reject");
          }
          setIsNoLoading(false);
        })
        .catch((error) => console.log(error));
    }, 5000);
  };

  return (
    <>
      {messageContext}

      <Modal
        centered
        closable
        closeIcon={<IconClose />}
        footer={[
          <Button
            danger={true}
            key="ok"
            loading={isLoading}
            onClick={handleCreateAuthRequest}
            type="primary"
          >
            Yes
          </Button>,
          <Button danger={true} key="cancel" loading={isNoLoading} onClick={handleCancel}>
            No
          </Button>,
        ]}
        maskClosable
        okButtonProps={{ danger: true, loading: isLoading }}
        onCancel={onClose}
        onOk={handleCreateAuthRequest}
        open
        title="Are you sure you want to verify this credential?"
      >
        {/* <Space direction="vertical">
          <Typography.Text type="secondary">Are you Sure?</Typography.Text>
        </Space> */}
      </Modal>
    </>
  );
}
