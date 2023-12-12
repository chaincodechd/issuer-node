import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Select, Space, message } from "antd";
// import { useEffect } from "react";
import { generatePath, useNavigate } from "react-router-dom";
import { getUserDID, signUp } from "src/adapters/api/user"; // Import your signup API function
import { useEnvContext } from "src/contexts/Env";
import { useUserContext } from "src/contexts/UserDetails";
import { Signup } from "src/domain/login";
import { ROUTES } from "src/routes";

export const SignUp = () => {
  const navigate = useNavigate();
  const { setUserDetails } = useUserContext();
  const [messageAPI, messageContext] = message.useMessage();
  const env = useEnvContext();

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

  return (
    <>
      {messageContext}
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
          <Input placeholder="Username" prefix={<UserOutlined className="site-form-item-icon" />} />
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
          name="firstname"
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
        <Form.Item>
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
    </>
  );
};
