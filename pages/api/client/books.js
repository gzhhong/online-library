import prisma from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  console.log('just in the handler of api/client/books');

  try {
    const { nickName } = req.query;

    // 更新用户最后访问时间
    let user = await prisma.user.findUnique({
      where: { nickName }
    });

    let accessLevel = 0;

    if (user) {
      // 更新用户访问时间
      user = await prisma.user.update({
        where: { nickName },
        data: { lastVisit: new Date() }
      });
      accessLevel = user.accessLevel;
    } else {
      // 记录访问日志
      let accessLog = await prisma.accessLog.findUnique({
        where: { nickName }
      });

      if (accessLog) {
        await prisma.accessLog.update({
          where: { nickName },
          data: {
            lastVisit: new Date(),
            visitCount: { increment: 1 }
          }
        });
      } else {
        console.log('create accessLog for new user', nickName);
        await prisma.accessLog.create({
          data: {
            nickName,
            firstVisit: new Date(),
            lastVisit: new Date(),
            visitCount: 1
          }
        });
      }
    }

    // 获取用户可访问的图书，不包括下架的图书
    const books = await prisma.book.findMany({
      where: {
        AND: [
          { accessLevel: { lte: accessLevel } },
          { unlist: false }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
} 