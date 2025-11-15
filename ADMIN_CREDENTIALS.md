# Admin Account Credentials

## Admin Login Details

**Email:** admin@bagami.com  
**Password:** Admin@123456  
**Role:** admin

## Important Notes

⚠️ **Security Warning:** Please change the password immediately after your first login for security purposes.

## How to Reset Admin Password

If you need to reset the admin password, you can run:

```bash
npm run seed
```

This will ensure the admin account exists with the default password.

## Creating Additional Admin Accounts

To create additional admin or superadmin accounts, you can:

1. Register a new user through the normal signup process
2. Manually update the user's role in the database using Prisma Studio:
   ```bash
   npx prisma studio
   ```
3. Find the user and change their `role` field to `admin` or `superadmin`

## Platform Settings

The platform commission rate has also been seeded:
- **Default Commission Rate:** 17.5%
- This can be changed from the backoffice Platform Settings page

---

*Last updated: November 9, 2025*
