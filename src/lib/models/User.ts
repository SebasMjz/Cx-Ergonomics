import bcrypt from 'bcrypt';
import mongoose, { Schema, type Document, type Model } from 'mongoose';
import validator from 'validator';

export type UserRole = 'admin' | 'technical';

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: (value: string) => validator.isEmail(value),
				message: 'Invalid email address',
			},
		},
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ['admin', 'technical'],
			default: 'technical',
		},
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

UserSchema.pre('save', async function hashPassword(next) {
	if (!this.isModified('password')) {
		return next();
	}

	try {
		this.password = await bcrypt.hash(this.password, 12);
		return next();
	} catch (error) {
		return next(error as Error);
	}
});

export const UserModel: Model<IUser> =
	(mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
