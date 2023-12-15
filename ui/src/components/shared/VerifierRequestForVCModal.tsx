import { Modal, message } from "antd";
import { useEffect, useState } from "react";
import { requestVC } from "src/adapters/api/requests";
import { getAllSchema } from "src/adapters/api/schemas";
import { ReactComponent as IconClose } from "src/assets/icons/x.svg";
import { useEnvContext } from "src/contexts/Env";
import { AppError, Credential } from "src/domain";
import { Schema } from "src/domain/schema";
import { AsyncTask, isAsyncTaskDataAvailable } from "src/utils/async";
import { isAbortedError } from "src/utils/browser";
import { CLOSE, VERIFY_IDENTITY } from "src/utils/constants";
import { notifyParseErrors } from "src/utils/error";

export function VerifierRequestVCModal({
  onClose,
  request,
}: {
  onClose: () => void;
  request: Credential;
}) {
  const env = useEnvContext();
  const [schemaData, setSchemaData] = useState<AsyncTask<Schema[], AppError>>({
    status: "pending",
  });
  const schemaList = isAsyncTaskDataAvailable(schemaData) ? schemaData.data : [];
  useEffect(() => {
    const getSchemas = async () => {
      const response = await getAllSchema({
        env,
      });
      if (response.success) {
        setSchemaData({
          data: response.data.successful,
          status: "successful",
        });
        notifyParseErrors(response.data.failed);
      } else {
        if (!isAbortedError(response.error)) {
          setSchemaData({ error: response.error, status: "failed" });
        }
      }
    };

    getSchemas().catch((e) => {
      console.error("An error occurred:", e);
    });
  }, [env]);

  {
    /* eslint-disable */
  }
  const age = `${request.credentialSubject.Age}`;
  {
    /* eslint-disable */
  }
  const [messageAPI, messageContext] = message.useMessage();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleVerifierVCRequest = async () => {
    const schema = schemaList.find((item) => item.type === request.credentialSubject.type);
    setIsLoading(true);
    const payload = {
      Age: age,
      ProofId: request.id,
      ProofType: schema?.type,
      RequestType: "VerifyVC",
      RoleType: "Individual",
      schemaID: schema?.id || "",
      Source: "Manual",
      userDID: request.userID,
    };

    await requestVC({ env, payload }).then((response) => {
      if (response.success) {
        void messageAPI.success("Requested Successfully").then(() => onClose());
      } else {
        void messageAPI.error("Request Failed");
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
        okText="Yes"
        onCancel={onClose}
        onOk={() => void handleVerifierVCRequest()}
        open
        title="Are you sure you want to request for VC?"
      ></Modal>
    </>
  );
}
