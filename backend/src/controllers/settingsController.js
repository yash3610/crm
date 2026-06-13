import Setting from "../models/Setting.js";
import Tenant from "../models/Tenant.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteUploadedFile,
  saveUploadedFile,
} from "../utils/uploadStorage.js";

const allowedSettingKeys = new Set([
  "account",
  "business",
  "company",
  "tax",
  "billing",
  "invoice",
  "print",
  "reminders",
  "caSharing",
  "pricing",
  "support",
  "notifications",
  "appearance",
]);

const uploadFields = {
  business: {
    logo: new Set(["image/jpeg", "image/png", "image/webp"]),
    signature: new Set(["image/jpeg", "image/png", "image/webp"]),
    registrationDocument: new Set([
      "image/jpeg",
      "image/png",
      "application/pdf",
    ]),
    gstCertificate: new Set(["image/jpeg", "image/png", "application/pdf"]),
    panCard: new Set(["image/jpeg", "image/png", "application/pdf"]),
  },
};

function hasExpectedFileSignature(data, mimeType) {
  if (mimeType === "image/jpeg") {
    return (
      data.length >= 3 &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff
    );
  }
  if (mimeType === "image/png") {
    return (
      data.length >= 8 &&
      data
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimeType === "image/webp") {
    return (
      data.length >= 12 &&
      data.subarray(0, 4).toString("ascii") === "RIFF" &&
      data.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "application/pdf") {
    return (
      data.length >= 5 && data.subarray(0, 5).toString("ascii") === "%PDF-"
    );
  }
  return false;
}

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({ tenantId: req.tenantId });
  const data = Object.fromEntries(
    settings.map((item) => [item.key, item.value]),
  );
  res.json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body);
  if (
    !entries.length ||
    entries.some(
      ([key, value]) =>
        !allowedSettingKeys.has(key) ||
        !value ||
        typeof value !== "object" ||
        Array.isArray(value),
    )
  ) {
    throw new ApiError(400, "Invalid settings payload");
  }

  await Promise.all(
    entries.map(([key, value]) =>
      Setting.findOneAndUpdate(
        { tenantId: req.tenantId, key },
        { tenantId: req.tenantId, value },
        { upsert: true, new: true, runValidators: true },
      ),
    ),
  );

  if (req.body.company?.name) {
    await Tenant.findByIdAndUpdate(req.tenantId, {
      name: req.body.company.name,
    });
  }
  if (req.body.business?.name) {
    await Tenant.findByIdAndUpdate(req.tenantId, {
      name: req.body.business.name,
    });
  }
  if (
    req.body.pricing?.plan &&
    ["starter", "growth", "premium"].includes(req.body.pricing.plan)
  ) {
    await Tenant.findByIdAndUpdate(req.tenantId, {
      plan: req.body.pricing.plan,
    });
  }

  res.json({ success: true, message: "Settings saved", data: req.body });
});

export const uploadSettingFile = asyncHandler(async (req, res) => {
  const { section, field } = req.params;
  const allowedMimeTypes = uploadFields[section]?.[field];
  const mimeType = req.get("content-type")?.split(";")[0].trim().toLowerCase();

  if (!allowedMimeTypes) {
    throw new ApiError(400, "This settings file field is not supported");
  }
  if (!mimeType || !allowedMimeTypes.has(mimeType)) {
    throw new ApiError(400, "Choose a supported JPG, PNG, WebP or PDF file");
  }
  if (!Buffer.isBuffer(req.body) || !req.body.length) {
    throw new ApiError(400, "Choose a file to upload");
  }
  if (!hasExpectedFileSignature(req.body, mimeType)) {
    throw new ApiError(400, "The selected file content is invalid");
  }

  const current = await Setting.findOne({
    tenantId: req.tenantId,
    key: section,
  });
  const previousFileUrl = current?.value?.[field];
  const fileUrl = await saveUploadedFile({
    tenantId: req.tenantId,
    field,
    mimeType,
    data: req.body,
  });

  try {
    await Setting.findOneAndUpdate(
      { tenantId: req.tenantId, key: section },
      {
        tenantId: req.tenantId,
        key: section,
        value: { ...(current?.value || {}), [field]: fileUrl },
      },
      { upsert: true, new: true, runValidators: true },
    );
  } catch (error) {
    await deleteUploadedFile(fileUrl, req.tenantId);
    throw error;
  }

  await deleteUploadedFile(previousFileUrl, req.tenantId);
  res.status(201).json({
    success: true,
    message: "File uploaded",
    data: { field, url: fileUrl },
  });
});
