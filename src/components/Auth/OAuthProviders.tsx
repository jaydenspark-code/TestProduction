// OAuthProviders removed: No OAuth providers enabled.
const OAuthProviders: React.FC = () => null;
        <h3 className="text-lg font-semibold text-white mb-2">Quick Sign Up</h3>
        <p className="text-gray-400 text-sm">Choose your preferred sign-in method</p>
      </div>
      
      <div className="space-y-3">
        {providers.filter(p => p.enabled).map((provider) => (
          <OAuthButton
            key={provider.id}
            provider={provider.name}
            icon={provider.icon}
            color={provider.color}
            disabled={loading === provider.id}
            onClick={() => handleOAuthSignIn(provider.id as any)}
          />
        ))}
      </div>

      {loading && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span>Connecting to {loading}...</span>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-800 text-gray-400">or continue with email</span>
        </div>
      </div>
    </div>
  );
};

export default OAuthProviders;
