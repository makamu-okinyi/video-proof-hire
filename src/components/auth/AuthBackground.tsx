/**
 * Auth/Login - Candra organic blobs as blurred background accents
 */
export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Candra organic shapes - large-scale blurred blobs */}
      <div
        className="absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full opacity-60 blur-3xl"
        style={{
          backgroundImage: 'url(/images/candra-blobs.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute -bottom-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full opacity-50 blur-3xl"
        style={{
          backgroundImage: 'url(/images/candra-blobs.png)',
          backgroundSize: 'cover',
          backgroundPosition: '60% 40%',
        }}
      />
    </div>
  );
}
