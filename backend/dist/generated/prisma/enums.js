"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRecommendation = exports.FormFieldType = exports.FormType = exports.ActivityStatus = exports.EventStatus = exports.SubmissionStatus = exports.TicketStatus = exports.TicketType = exports.UserRole = void 0;
exports.UserRole = {
    ORGANIZER: 'ORGANIZER',
    REVIEWER: 'REVIEWER',
    PARTICIPANT: 'PARTICIPANT'
};
exports.TicketType = {
    FREE: 'FREE',
    PAID: 'PAID'
};
exports.TicketStatus = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};
exports.SubmissionStatus = {
    SUBMITTED: 'SUBMITTED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
};
exports.EventStatus = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED'
};
exports.ActivityStatus = {
    SCHEDULED: 'SCHEDULED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
};
exports.FormType = {
    REGISTRATION: 'REGISTRATION',
    SUBMISSION: 'SUBMISSION'
};
exports.FormFieldType = {
    TEXT: 'TEXT',
    TEXTAREA: 'TEXTAREA',
    SELECT: 'SELECT',
    MULTISELECT: 'MULTISELECT',
    CHECKBOX: 'CHECKBOX',
    DATE: 'DATE',
    NUMBER: 'NUMBER',
    EMAIL: 'EMAIL'
};
exports.ReviewRecommendation = {
    STRONG_ACCEPT: 'STRONG_ACCEPT',
    ACCEPT: 'ACCEPT',
    WEAK_ACCEPT: 'WEAK_ACCEPT',
    BORDERLINE: 'BORDERLINE',
    WEAK_REJECT: 'WEAK_REJECT',
    REJECT: 'REJECT',
    STRONG_REJECT: 'STRONG_REJECT'
};
//# sourceMappingURL=enums.js.map