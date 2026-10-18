type userType = {
  username: string;
  email: string;
  password: string;
};

export const signUpService = (userData: userType) => {
  console.log(`User ${userData.username} signed up.`);
};
