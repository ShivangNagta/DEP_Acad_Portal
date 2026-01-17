import { useTheme } from '../context/ThemeContext';
import { BookOpen } from 'lucide-react';

const LoadingScreen = () => {
    const { colors } = useTheme();

    return (
        <div className="fixed inset-0 flex items-center justify-center transition-colors duration-300"
            style={{ backgroundColor: colors.bgPrimary }}>
            <div className="text-center">
                <div className="relative mb-8">
                    <BookOpen
                        size={64}
                        className="animate-pulse mx-auto"
                        style={{ color: colors.primary }}
                    />
                    <div className="absolute -inset-4 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: colors.primary }}></div>
                </div>
                <h2 className="text-xl font-semibold mb-2 transition-colors duration-300"
                    style={{ color: colors.textPrimary }}>
                    Loading Dashboard
                </h2>
                <p className="transition-colors duration-300"
                    style={{ color: colors.textSecondary }}>
                    Please wait while we prepare your workspace
                </p>
                <div className="mt-6 w-48 h-1 mx-auto overflow-hidden rounded-full"
                    style={{ backgroundColor: colors.bgTertiary }}>
                    <div className="h-full rounded-full animate-loading"
                        style={{ backgroundColor: colors.primary }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
