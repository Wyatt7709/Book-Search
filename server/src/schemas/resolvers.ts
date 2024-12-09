import User from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';

interface LoginuserArgs {
    email: string;
    password: string;
}

interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string;
    }
}

interface AddBookArgs {
    input: {
        bookId: string;
        ttle: string;
        authors: string[];
        description: string;
        image: string;
        link: string;
    }
}

interface RemoveBookArgs {
    bookId: string;
}

const resolvers = {
    Query: {
        me: async (_parent: any, _args: any, context: any) => {
            if (context.user) {
                return User.findOne({ _id: context.user.data._id });
            }

            throw new AuthenticationError('Could not validate user.');
        },
    },
    Mutation: {
        login: async (_parent: any, { email, password }: LoginuserArgs) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('User email not found.');
            }

            const correctPassword = await user.isCorrectPassword(password);

            if (!correctPassword) {
                throw new AuthenticationError('Could not validate user.');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        addUser: async (_parent: any, { input }: AddUserArgs) => {
            const user = await User.create({ ...input });

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        saveBook: async (_parent: any, { input }: AddBookArgs, context: any) => {
            console.log("inside saveBook")
            console.log(context.user)
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user.data._id },
                    {
                        $addToSet: { savedBooks: { ...input } }
                    },
                    { new: true },
                );

                return updatedUser;
            }

            throw new AuthenticationError('Error adding book.');
        },
        removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: any) => {
            if (context.user) {
                return await User.findOneAndUpdate(
                    { _id: context.user.data._id },
                    {
                        $pull: { savedBooks: { bookId } }
                    },
                    { new: true },
                );
            }

            throw new AuthenticationError('Error removing book.');            
        },
    },
};

export default resolvers;