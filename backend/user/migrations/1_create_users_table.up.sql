CREATE TABLE usersrcd (
  loginid VARCHAR(12) PRIMARY KEY,
  hashedpassword TEXT NOT NULL,
  userrole VARCHAR(8) NOT NULL CHECK (userrole IN ('Parent', 'Admin', 'Teacher', 'Dispatch')),
  userid VARCHAR(8) NOT NULL UNIQUE,
  username VARCHAR(8) NOT NULL UNIQUE,
  userstatus VARCHAR(8) NOT NULL DEFAULT 'Active' CHECK (userstatus IN ('Active', 'Disabled')),
  lastlogindttm TIMESTAMP,
  lastphonehash TEXT,
  lastdeviceid TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_userid ON usersrcd(userid);
CREATE INDEX idx_users_role ON usersrcd(userrole);
CREATE INDEX idx_users_status ON usersrcd(userstatus);
