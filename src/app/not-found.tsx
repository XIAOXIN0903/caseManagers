import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">页面不存在</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
