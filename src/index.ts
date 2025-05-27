import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import bodyParser from "body-parser";

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

interface Contact {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  linkedId: number | null;
  linkPrecedence: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const identifyHandler = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    res.status(400).json({ error: "Email or phoneNumber is required." });
    return;
  }

  const existingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  let primaryContact: Contact | null = null;
  let secondaryContacts: Contact[] = [];

  if (existingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });
    primaryContact = newContact as unknown as Contact;
  } else {
    primaryContact =
      (existingContacts.find(
        (c) => c.linkPrecedence === "primary"
      ) as unknown as Contact) || (existingContacts[0] as unknown as Contact);

    const exists = existingContacts.find(
      (c) => c.email === email && c.phoneNumber === phoneNumber
    );

    if (!exists && primaryContact) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primaryContact.id,
          linkPrecedence: "secondary",
        },
      });
    }

    if (primaryContact) {
      const allRelatedContacts = await prisma.contact.findMany({
        where: {
          OR: [{ id: primaryContact.id }, { linkedId: primaryContact.id }],
        },
        orderBy: { createdAt: "asc" },
      });

      primaryContact =
        (allRelatedContacts.find(
          (c) => c.linkPrecedence === "primary"
        ) as unknown as Contact) || null;

      secondaryContacts = allRelatedContacts.filter(
        (c) => c.linkPrecedence === "secondary"
      ) as unknown as Contact[];
    }
  }

  if (!primaryContact) {
    res.status(500).json({ error: "Primary contact could not be determined." });
    return;
  }

  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  const allContacts: Contact[] = [primaryContact, ...secondaryContacts];

  allContacts.forEach((c) => {
    if (c.email) emails.add(c.email);
    if (c.phoneNumber) phoneNumbers.add(c.phoneNumber);
    if (c.linkPrecedence === "secondary") secondaryContactIds.push(c.id);
  });

  res.json({
    contact: {
      primaryContactId: primaryContact.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds,
    },
  });
};

app.post("/identify", identifyHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
