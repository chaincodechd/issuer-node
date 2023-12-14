import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Select, Space, message } from "antd";
// import { useEffect } from "react";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { getUserDID, signUp, verifierSignup } from "src/adapters/api/user"; // Import your signup API function
import { useEnvContext } from "src/contexts/Env";
import { useUserContext } from "src/contexts/UserDetails";
import { useVerifierContext } from "src/contexts/VerifierDetails";
import { Signup, VerifierSignup } from "src/domain/login";
import { ROUTES } from "src/routes";

export const SignUp = () => {
  const navigate = useNavigate();
  const { setUserDetails } = useUserContext();
  const { setVerifierDetails } = useVerifierContext();
  const [messageAPI, messageContext] = message.useMessage();
  const env = useEnvContext();
  const { typeOfUser } = useParams();
  //console.log(typeOfUser);

  const onFinish = (values: Signup) => {
    const payload = {
      didMetadata: {
        blockchain: "polygon",
        method: "polygonid",
        network: "mumbai",
      },
    };
    void getUserDID({
      payload,
    })
      .then((response) => {
        if (response.success) {
          const payload = {
            Email: values.email,
            firstName: values.firstName,
            Password: values.password,
            Role: values.role,
            UserDID: response.data.identifier,
            UserName: values.username,
          };
          void signUp({
            env,
            payload,
          }).then((signUpResponse) => {
            console.log(payload);
            if (signUpResponse.success) {
              console.log(signUpResponse.data);
              void navigate(generatePath(ROUTES.login.path));
              setUserDetails(
                values.username,
                values.email,
                values.password,
                values.firstName,
                values.role,
                response.data.identifier
              );
            }
          });
          // void navigate(generatePath(ROUTES.register.path), { state: { data: response.data.identifier } });
        } else {
          void messageAPI.error(response.error.message);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    // localStorage.setItem("user", values.username);
    // Set other user-related data to localStorage as needed
  };

  const onFinishVerifier = (values: VerifierSignup) => {
    const payload = {
      OrganizationName: values.OrganizationName,
      OrgEmail: values.OrgEmail,
      OrgPassword: values.OrgPassword,
      OrgUsername: values.OrgUsername,
    };
    void verifierSignup({
      env,
      payload,
    }).then((response) => {
      if (response.success) {
        console.log(response.data);
        void navigate(generatePath(ROUTES.login.path));
        setVerifierDetails(
          values.OrganizationName,
          values.OrgPassword,
          values.OrgEmail,
          values.OrgUsername
        );
      }
    });
    // void navigate(generatePath(ROUTES.register.path), { state: { data: response.data.identifier } });
    // localStorage.setItem("user", values.username);
    // Set other user-related data to localStorage as needed
  };
  return (
    <>
      {messageContext}
      {typeOfUser === "user" && (
        <Form
          className="signup-form"
          initialValues={{
            remember: true,
          }}
          name="normal_signup"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[
              {
                message: "Please input your Username!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="Username"
              prefix={<UserOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              {
                message: "Please enter a valid email address!",
                type: "email",
              },
              {
                message: "Please input your Email!",
                required: true,
              },
            ]}
          >
            <Input placeholder="Email" prefix={<MailOutlined className="site-form-item-icon" />} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                message: "Please input your Password!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="Password"
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
            />
          </Form.Item>
          <Form.Item
            name="firstName"
            rules={[
              {
                message: "Please input your First Name!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="First Name"
              prefix={<UserOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item name="role" rules={[{ message: "Please select a role!", required: true }]}>
            <Select defaultValue="Business">
              <Select.Option value="Business">Business</Select.Option>
              <Select.Option value="Individual">Individual</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="remember"
            style={{
              marginBottom: "10",
            }}
            valuePropName="checked"
          >
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button className="signup-form-button" htmlType="submit" type="primary">
                Sign up
              </Button>
              Or <a href={generatePath(ROUTES.login.path)}>Log in now!</a>
            </Space>
          </Form.Item>
        </Form>
      )}
      {typeOfUser === "verifier" && (
        <Form
          className="signup-form"
          initialValues={{
            remember: true,
          }}
          name="verifier_signup"
          onFinish={onFinishVerifier}
        >
          {/* Verifier registration fields */}
          <Form.Item
            name="OrganizationName"
            rules={[
              {
                message: "Please input your Organization Name!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="Organization Name"
              prefix={<UserOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item
            name="OrgUsername"
            rules={[
              {
                message: "Please input your Organization Username!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="Org Username"
              prefix={<UserOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item
            name="OrgPassword"
            rules={[
              {
                message: "Please input your Organization Password!",
                required: true,
              },
            ]}
          >
            <Input
              placeholder="Org Password"
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
            />
          </Form.Item>
          <Form.Item
            name="OrgEmail"
            rules={[
              {
                message: "Please input a valid Organization Email!",
                required: true,
                type: "email",
              },
            ]}
          >
            <Input
              placeholder="Org Email"
              prefix={<MailOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button className="signup-form-button" htmlType="submit" type="primary">
                Sign up
              </Button>
              Or <a href={generatePath(ROUTES.login.path)}>Log in now!</a>
            </Space>
          </Form.Item>
        </Form>
      )}
    </>
  );
};
