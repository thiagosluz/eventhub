"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineExtension = exports.NullsOrder = exports.JsonNullValueFilter = exports.QueryMode = exports.JsonNullValueInput = exports.NullableJsonNullValueInput = exports.SortOrder = exports.IssuedCertificateScalarFieldEnum = exports.CertificateTemplateScalarFieldEnum = exports.AttendanceScalarFieldEnum = exports.ReviewScalarFieldEnum = exports.SubmissionScalarFieldEnum = exports.CustomFormAnswerScalarFieldEnum = exports.CustomFormResponseScalarFieldEnum = exports.CustomFormFieldScalarFieldEnum = exports.CustomFormScalarFieldEnum = exports.TicketScalarFieldEnum = exports.ActivityEnrollmentScalarFieldEnum = exports.RegistrationScalarFieldEnum = exports.ActivitySpeakerScalarFieldEnum = exports.SpeakerScalarFieldEnum = exports.ActivityScalarFieldEnum = exports.EventScalarFieldEnum = exports.UserScalarFieldEnum = exports.TenantScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = __importStar(require("@prisma/client/runtime/client"));
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.5.0",
    engine: "280c870be64f457428992c43c1f6d557fab6e29e"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Tenant: 'Tenant',
    User: 'User',
    Event: 'Event',
    Activity: 'Activity',
    Speaker: 'Speaker',
    ActivitySpeaker: 'ActivitySpeaker',
    Registration: 'Registration',
    ActivityEnrollment: 'ActivityEnrollment',
    Ticket: 'Ticket',
    CustomForm: 'CustomForm',
    CustomFormField: 'CustomFormField',
    CustomFormResponse: 'CustomFormResponse',
    CustomFormAnswer: 'CustomFormAnswer',
    Submission: 'Submission',
    Review: 'Review',
    Attendance: 'Attendance',
    CertificateTemplate: 'CertificateTemplate',
    IssuedCertificate: 'IssuedCertificate'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.TenantScalarFieldEnum = {
    id: 'id',
    name: 'name',
    slug: 'slug',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    password: 'password',
    name: 'name',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    tenantId: 'tenantId'
};
exports.EventScalarFieldEnum = {
    id: 'id',
    tenantId: 'tenantId',
    name: 'name',
    slug: 'slug',
    description: 'description',
    location: 'location',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    bannerUrl: 'bannerUrl',
    logoUrl: 'logoUrl',
    themeConfig: 'themeConfig',
    seoTitle: 'seoTitle',
    seoDescription: 'seoDescription',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ActivityScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    title: 'title',
    description: 'description',
    location: 'location',
    startAt: 'startAt',
    endAt: 'endAt',
    capacity: 'capacity',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SpeakerScalarFieldEnum = {
    id: 'id',
    tenantId: 'tenantId',
    name: 'name',
    bio: 'bio',
    avatarUrl: 'avatarUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ActivitySpeakerScalarFieldEnum = {
    activityId: 'activityId',
    speakerId: 'speakerId'
};
exports.RegistrationScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    userId: 'userId',
    createdAt: 'createdAt'
};
exports.ActivityEnrollmentScalarFieldEnum = {
    id: 'id',
    activityId: 'activityId',
    registrationId: 'registrationId',
    createdAt: 'createdAt'
};
exports.TicketScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    registrationId: 'registrationId',
    type: 'type',
    status: 'status',
    price: 'price',
    qrCodeToken: 'qrCodeToken',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CustomFormScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    name: 'name',
    type: 'type',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CustomFormFieldScalarFieldEnum = {
    id: 'id',
    formId: 'formId',
    label: 'label',
    type: 'type',
    required: 'required',
    order: 'order',
    options: 'options',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CustomFormResponseScalarFieldEnum = {
    id: 'id',
    formId: 'formId',
    registrationId: 'registrationId',
    submissionId: 'submissionId',
    createdAt: 'createdAt'
};
exports.CustomFormAnswerScalarFieldEnum = {
    id: 'id',
    responseId: 'responseId',
    fieldId: 'fieldId',
    value: 'value'
};
exports.SubmissionScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    authorId: 'authorId',
    title: 'title',
    abstract: 'abstract',
    fileUrl: 'fileUrl',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ReviewScalarFieldEnum = {
    id: 'id',
    submissionId: 'submissionId',
    reviewerId: 'reviewerId',
    score: 'score',
    recommendation: 'recommendation',
    comments: 'comments',
    createdAt: 'createdAt'
};
exports.AttendanceScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    activityId: 'activityId',
    checkedAt: 'checkedAt'
};
exports.CertificateTemplateScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    name: 'name',
    backgroundUrl: 'backgroundUrl',
    layoutConfig: 'layoutConfig',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.IssuedCertificateScalarFieldEnum = {
    id: 'id',
    templateId: 'templateId',
    registrationId: 'registrationId',
    fileUrl: 'fileUrl',
    issuedAt: 'issuedAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map